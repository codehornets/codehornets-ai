import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { Contact } from './contact.entity';
import { createMockRepository } from '@funnelagents/shared/testing';

describe('ContactsService', () => {
  let service: ContactsService;
  let repository: jest.Mocked<Repository<Contact>>;

  const mockContact = {
    id: 'contact-1',
    workspace_id: 'workspace-1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1-555-0100',
    company: 'Tech Corp',
    position: 'CTO',
    tags: ['vip', 'tech'],
    custom_fields: {},
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const mockRepo = createMockRepository<Contact>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactsService,
        {
          provide: getRepositoryToken(Contact),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<ContactsService>(ContactsService);
    repository = module.get(getRepositoryToken(Contact));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all contacts', async () => {
      const contacts = [mockContact];
      repository.find.mockResolvedValue(contacts);

      const result = await service.findAll();

      expect(result).toEqual(contacts);
      expect(repository.find).toHaveBeenCalled();
    });

    it('should filter contacts by workspace_id', async () => {
      const contacts = [mockContact];
      repository.find.mockResolvedValue(contacts);

      const result = await service.findAll('workspace-1');

      expect(result).toEqual(contacts);
      expect(repository.find).toHaveBeenCalledWith({
        where: { workspace_id: 'workspace-1' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a contact by id', async () => {
      repository.findOne.mockResolvedValue(mockContact);

      const result = await service.findOne('contact-1');

      expect(result).toEqual(mockContact);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'contact-1' },
      });
    });

    it('should throw NotFoundException if contact not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new contact', async () => {
      const createDto = {
        workspace_id: 'workspace-1',
        name: 'Jane Doe',
        email: 'jane@example.com',
        company: 'StartupCo',
      };

      repository.create.mockReturnValue(mockContact);
      repository.save.mockResolvedValue(mockContact);

      const result = await service.create(createDto);

      expect(result).toEqual(mockContact);
      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalledWith(mockContact);
    });
  });

  describe('update', () => {
    it('should update a contact', async () => {
      const updateDto = { name: 'John Updated' };
      const updatedContact = { ...mockContact, ...updateDto };

      repository.findOne.mockResolvedValue(mockContact);
      repository.save.mockResolvedValue(updatedContact);

      const result = await service.update('contact-1', updateDto);

      expect(result).toEqual(updatedContact);
      expect(repository.save).toHaveBeenCalledWith(updatedContact);
    });

    it('should throw NotFoundException if contact not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.update('nonexistent', { name: 'Test' })).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('remove', () => {
    it('should remove a contact', async () => {
      repository.findOne.mockResolvedValue(mockContact);
      repository.remove.mockResolvedValue(mockContact);

      await service.remove('contact-1');

      expect(repository.remove).toHaveBeenCalledWith(mockContact);
    });

    it('should throw NotFoundException if contact not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
