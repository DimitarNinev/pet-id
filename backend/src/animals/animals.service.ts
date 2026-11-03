import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { randomBytes } from 'node:crypto';
import { SupabaseStorageService } from './supabase-storage.service.js';

function generatePetId(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(8);

  const code = Array.from(
    bytes,
    (byte) => alphabet[byte % alphabet.length],
  ).join('');

  return `PET-${code}`;
}

@Injectable()
export class AnimalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: SupabaseStorageService,
  ) { }

  async findAll(userId: string) {
    return this.prisma.animal.findMany({
      where: {
        owners: {
          some: {
            userId,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async searchForVet(vetUserId: string, query: string) {
    const searchValue = query.trim();

    if (!searchValue) {
      throw new NotFoundException('Въведи Pet ID или номер на микрочип.');
    }

    // Проверяваме актуалната роля и одобрението директно в базата.
    const vet = await this.prisma.user.findUnique({
      where: { id: vetUserId },
      select: {
        role: true,
        vetApproved: true,
      },
    });

    if (!vet || vet.role !== 'VET' || !vet.vetApproved) {
      throw new ForbiddenException(
        'Достъпът е разрешен само за одобрени ветеринарни лекари.',
      );
    }

    // Търсим само едно животно по точен Pet ID или микрочип.
    const animal = await this.prisma.animal.findFirst({
      where: {
        OR: [
          { petId: searchValue },
          { microchipId: searchValue },
        ],
      },
      select: {
        id: true,
        petId: true,
        name: true,
        species: true,
        breed: true,
        sex: true,
        dateOfBirth: true,
        microchipId: true,
        photoPath: true,
        createdAt: true,
      },
    });

    if (!animal) {
      console.log('Animal not found for:', searchValue);
      throw new NotFoundException(
        'Не е намерено животно с този Pet ID или микрочип.',
      );
    }

    return animal;
  }

  async create(
    userId: string,
    data: {
      name: string;
      species: string;
      breed?: string;
      sex?: string;
      dateOfBirth?: string;
      microchipId?: string;
      notes?: string;
    },
  ) {
    try {
      return await this.prisma.animal.create({
        data: {
          petId: generatePetId(),
          name: data.name,
          species: data.species,
          breed: data.breed,
          sex: data.sex,
          dateOfBirth: data.dateOfBirth
            ? new Date(data.dateOfBirth)
            : undefined,
          microchipId: data.microchipId,
          notes: data.notes,
          owners: {
            create: {
              user: {
                connect: { id: userId },
              },
              isPrimary: true,
            },
          },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Този номер на микрочип вече е регистриран.',
        );
      }

      throw error;
    }
  }

  async findOne(userId: string, animalId: string) {
    const animal = await this.prisma.animal.findFirst({
      where: {
        id: animalId,
        owners: {
          some: {
            userId,
          },
        },
      },
    });

    if (!animal) {
      throw new NotFoundException('Животното не е намерено.');
    }

    return animal;
  }


  async update(
    userId: string,
    animalId: string,
    data: {
      name?: string;
      species?: string;
      breed?: string | null;
      sex?: string | null;
      dateOfBirth?: string | null;
      microchipId?: string | null;
      notes?: string | null;
    },
  ) {
    // Проверяваме дали животното принадлежи на потребителя.
    await this.findOne(userId, animalId);

    return this.prisma.animal.update({
      where: {
        id: animalId,
      },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.species !== undefined && { species: data.species }),
        ...(data.breed !== undefined && { breed: data.breed }),
        ...(data.sex !== undefined && { sex: data.sex }),
        ...(data.dateOfBirth !== undefined && {
          dateOfBirth: data.dateOfBirth
            ? new Date(data.dateOfBirth)
            : null,
        }),
        ...(data.microchipId !== undefined && {
          microchipId: data.microchipId,
        }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });
  }

  async uploadPhoto(
    userId: string,
    animalId: string,
    file: Express.Multer.File,
  ) {
    // Проверяваме дали животното принадлежи на потребителя.
    const animal = await this.findOne(userId, animalId);

    const newPhotoPath = await this.storageService.uploadAnimalPhoto(
      userId,
      animalId,
      file,
    );

    try {
      const updatedAnimal = await this.prisma.animal.update({
        where: { id: animalId },
        data: {
          photoPath: newPhotoPath,
        },
      });

      // Изтриваме старата снимка едва след успешния запис на новата.
      if (animal.photoPath) {
        try {
          await this.storageService.deletePhoto(animal.photoPath);
        } catch {
          // Не проваляме успешната подмяна заради стара снимка,
          // която не е могла да бъде изтрита.
        }
      }

      return {
        id: updatedAnimal.id,
        photoPath: updatedAnimal.photoPath,
      };
    } catch (error) {
      // Ако записът в базата се провали, премахваме новия файл.
      try {
        await this.storageService.deletePhoto(newPhotoPath);
      } catch {
        // Оставяме основната грешка непроменена.
      }

      throw error;
    }
  }

  async getPhotoUrl(userId: string, animalId: string) {
    const animal = await this.findOne(userId, animalId);

    if (!animal.photoPath) {
      throw new NotFoundException('Животното няма качена снимка.');
    }

    const photoUrl = await this.storageService.createSignedUrl(
      animal.photoPath,
    );

    return { photoUrl };
  }

  async getPhotoUrlForVet(vetUserId: string, animalId: string) {
    const vet = await this.prisma.user.findUnique({
      where: { id: vetUserId },
      select: {
        role: true,
        vetApproved: true,
      },
    });

    if (!vet || vet.role !== 'VET' || !vet.vetApproved) {
      throw new ForbiddenException(
        'Достъпът е разрешен само за одобрени ветеринарни лекари.',
      );
    }

    const animal = await this.prisma.animal.findUnique({
      where: { id: animalId },
      select: {
        id: true,
        photoPath: true,
      },
    });

    if (!animal) {
      throw new NotFoundException('Животното не е намерено.');
    }

    if (!animal.photoPath) {
      throw new NotFoundException('Животното няма качена снимка.');
    }

    const photoUrl = await this.storageService.createSignedUrl(
      animal.photoPath,
    );

    return { photoUrl };
  }

  async remove(userId: string, animalId: string) {
    return this.prisma.$transaction(async (tx) => {
      const animal = await tx.animal.findFirst({
        where: {
          id: animalId,
          owners: {
            some: {
              userId,
            },
          },
        },
        select: {
          id: true,
        },
      });

      if (!animal) {
        throw new NotFoundException('Животното не е намерено.');
      }

      const medicalRecords = await tx.medicalRecord.findMany({
        where: {
          animalId,
        },
        select: {
          id: true,
          createdById: true,
          createdBy: {
            select: {
              role: true,
            },
          },
        },
      });

      const hasProtectedRecords = medicalRecords.some(
        (record) =>
          record.createdById !== userId ||
          record.createdBy.role !== 'OWNER',
      );

      if (hasProtectedRecords) {
        throw new ConflictException(
          'Животното не може да бъде изтрито, защото има медицински записи, създадени от ветеринар или друг потребител.',
        );
      }

      const recordIds = medicalRecords.map((record) => record.id);

      if (recordIds.length > 0) {
        await tx.examination.deleteMany({
          where: {
            medicalRecordId: { in: recordIds },
          },
        });

        await tx.vaccination.deleteMany({
          where: {
            medicalRecordId: { in: recordIds },
          },
        });

        await tx.labResult.deleteMany({
          where: {
            medicalRecordId: { in: recordIds },
          },
        });

        await tx.medicalRecord.deleteMany({
          where: {
            animalId,
            createdById: userId,
          },
        });
      }

      return tx.animal.delete({
        where: {
          id: animalId,
        },
      });
    });
  }

}
