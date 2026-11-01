// script.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { calcularTotalGastos, filtrarGastosPorPeriodo } from './script.js';

describe('Calculadora de Gastos - Pruebas Unitarias', () => {
  
  const mockGastos = [
    { id: Date.now(), concepto: 'Super', categoria: 'Comida', monto: 1500 },
    { id: Date.now() - 1000, concepto: 'Colectivo', categoria: 'Transporte', monto: 500 },
  ];

  it('Debe calcular correctamente la suma total de los gastos', () => {
    const total = calcularTotalGastos(mockGastos);
    expect(total).toBe(2000);
  });

  it('Debe retornar cero si la lista de gastos está vacía', () => {
    const total = calcularTotalGastos([]);
    expect(total).toBe(0);
  });

  it('Debe filtrar correctamente los gastos por el período de la semana actual', () => {
    const fechaActual = new Date();
    const gastosFiltrados = filtrarGastosPorPeriodo(mockGastos, 'semana', fechaActual);
    expect(gastosFiltrados.length).toBe(2);
  });

  it('Debe interactuar correctamente con localStorage simulado', () => {
    const clavePrueba = 'test-gastos';
    const datos = JSON.stringify(mockGastos);
    
    localStorage.setItem(clavePrueba, datos);
    const recuperados = JSON.parse(localStorage.getItem(clavePrueba));
    
    expect(recuperados.length).toBe(2);
    expect(recuperados[0].concepto).toBe('Super');
    
    localStorage.removeItem(clavePrueba);
    expect(localStorage.getItem(clavePrueba)).toBeNull();
  });

});