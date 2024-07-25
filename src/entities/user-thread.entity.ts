import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class UserThread {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  threadId: string;

  @Column()
  assistantId: string;

  @CreateDateColumn()
  createdAt: Date;
}
