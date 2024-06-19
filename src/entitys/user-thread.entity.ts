import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

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
}
