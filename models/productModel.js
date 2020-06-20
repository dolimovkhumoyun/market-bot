const axios = require("axios");

module.exports = {
  async getProducts(id) {
    return axios
      .get(`http://localhost:2020/product/bycategory/${id}`)
      .then((res) => {
        return res;
      })
      .catch((err) => console.log(err));
  },
  async getProduct(id) {
    return axios
      .get(`http://localhost:2020/product/${id}`)
      .then((res) => {
        return res;
      })
      .catch((err) => console.log(err));
  },
};
