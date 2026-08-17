class ApiResponse {
  constructor(data, message = "Request completed successfully") {
    this.status = "success";
    this.message = message;
    this.data = data;
  }
}

module.exports = ApiResponse;
