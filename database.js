const mongoose = require("mongoose");

class Database {
  constructor() {
    this.connect();
  }
  connect() {
    const password = encodeURIComponent("lamasse123@");
    mongoose
      .connect(
        `mongodb+srv://hamdy:${password}@cluster0.7lhg4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
      )
      .then(() => {
        console.log("database connection successful");
      })
      .catch((err) => {
        console.log("database connection error" + err);
      });
  }
}

module.exports = new Database();
