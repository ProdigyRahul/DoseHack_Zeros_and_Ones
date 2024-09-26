declare global {
  namespace NodeJS {
    interface Global {
      mongoose: any; // You can replace `any` with `import('mongoose').Mongoose` for better typing
    }
  }
}

export {}; // Ensure this file is treated as a module.
