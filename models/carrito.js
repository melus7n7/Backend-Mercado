'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class carrito extends Model {
    static associate(models) {
      carrito.hasMany(models.carritoproducto, {as: 'carritoproducto' ,foreignKey: 'carritoid'});
      //carrito.belongsToMany(models.producto, {as: 'producto', through: 'carritoproducto', foreignKey: 'carritoid'})
    }
  }
  carrito.init({
    id:{
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    protegida: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    sequelize,
    freezeTableName: true,
    modelName: 'carrito',
  });
  return carrito;
};