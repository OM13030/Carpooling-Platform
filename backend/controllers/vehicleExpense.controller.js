const vehicleExpenseService = require('../services/vehicleExpense.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const addExpense = asyncHandler(async (req, res) => {
  const employeeId = req.user._id;
  const expense = await vehicleExpenseService.addExpense(employeeId, req.body);
  res.status(201).json(new ApiResponse(201, expense, 'Vehicle expense logged successfully'));
});

module.exports = {
  addExpense,
};
