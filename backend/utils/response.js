export const success = (data, message = 'Success') => ({
  success: true,
  message,
  data
});

export const error = (message, statusCode = 500) => ({
  success: false,
  message,
  statusCode
});
