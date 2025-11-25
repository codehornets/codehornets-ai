import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('files')
export class File {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  filename: string;

  @Column()
  original_name: string;

  @Column()
  mimetype: string;

  @Column()
  size: number;

  @Column()
  path: string;

  @Column()
  url: string;

  @Column({ nullable: true })
  workspace_id?: string;

  @Column({ nullable: true })
  uploaded_by?: string;

  @CreateDateColumn()
  created_at: Date;
}
