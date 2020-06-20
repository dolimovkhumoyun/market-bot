const axios = require("axios");

module.exports = {
  async getWatchlist(id) {
    return axios
      .get(`http://localhost:2020/order/${id}`)
      .then((res) => {
        return res;
      })
      .catch((err) => console.log(err));
  },
  async addItem(data) {
    return axios
      .post(`http://localhost:2020/order/`, data)
      .then((res) => {
        return res;
      })
      .catch((err) => console.log(err));
  },
  async cancelOrder(user_id) {
    return axios
      .delete(`http://localhost:2020/order/${user_id}`)
      .then((res) => {
        return res;
      })
      .catch((err) => console.log(""));
  },
  async confirmOrder(data) {
    return axios
      .post(`http://localhost:2020/order/confirm`, data)
      .then((res) => {
        return res;
      })
      .catch((err) => console.log(""));
  },
};
