// Konfigurasi Prisma sederhana untuk CLI.
// Tidak memakai import eksternal supaya tidak mengganggu Next.js TypeScript build.

const config = {
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
};

export default config;
