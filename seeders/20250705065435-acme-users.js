'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('users', [
      {
        name: 'User 1',
        role: 'accountant',
        companyId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'User 2',
        role: 'corporateSecretary',
        companyId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'User 3',
        role: 'director',
        companyId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'User 4',
        role: 'accountant',
        companyId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'User 5',
        role: 'director',
        companyId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('users', null, {});
  }
};
