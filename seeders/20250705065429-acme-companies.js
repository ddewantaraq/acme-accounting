'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('companies', [
      {
        name: 'Company 1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Company 2',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ]);
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('companies', null, {});
  }
};
