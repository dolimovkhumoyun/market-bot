const axios = require("axios");

module.exports = {
  async getAll() {
    return axios
      .get("http://localhost:2020/category/all")
      .then((res) => {
        return res;
      })
      .catch((err) => console.log(err));
  },
};
