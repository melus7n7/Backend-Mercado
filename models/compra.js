'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class compra extends Model {
    static associate(models) {
      compra.hasMany(models.compraproducto, { as: 'compraproducto', foreignKey: 'compraid' });
      compra.belongsTo(models.usuario)
    }
  }
  compra.init({
    id: {
      primaryKey: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true
    },
    fechapedido: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    usuarioid: {
      type: DataTypes.UUID,
      allowNull: false
    }
  }, {
    sequelize,
    freezeTableName: true,
    modelName: 'compra',
  });
  return compra;
};