import * as bcrypt from 'bcrypt';
import { PrismaClient, UserRole } from '@prisma/client';
import 'dotenv/config';



const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@mergeon.dev' },
    update: {},
    create: {
      email: 'admin@mergeon.dev',
      username: 'admin',
      passwordHash,
      role: UserRole.ADMIN,
    },
  });

  const member = await prisma.user.upsert({
    where: { email: 'dev@mergeon.dev' },
    update: {},
    create: {
      email: 'dev@mergeon.dev',
      username: 'devuser',
      passwordHash,
      role: UserRole.MEMBER,
    },
  });

  const org = await prisma.organization.upsert({
    where: { githubOrg: 'acme-corp' },
    update: {},
    create: {
      name: 'Acme Corp',
      githubOrg: 'acme-corp',
      members: {
        create: [
          { userId: admin.id, role: UserRole.ADMIN },
          { userId: member.id, role: UserRole.MEMBER },
        ],
      },
    },
  });

  const repo = await prisma.repository.upsert({
    where: { githubId: 123456 },
    update: {},
    create: {
      organizationId: org.id,
      name: 'backend-api',
      fullName: 'acme-corp/backend-api',
      githubId: 123456,
      private: false,
    },
  });

  console.log('Seeded:', { admin: admin.email, member: member.email, org: org.name, repo: repo.fullName });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());