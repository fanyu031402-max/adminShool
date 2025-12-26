export default {
    SET_TOKEN(state, token) {
      state.user.token = token
    },
  
    ADD_CART_ITEM(state, item) {
      state.cart.push(item)
    },
  
    CLEAR_CART(state) {
      state.cart = []
    },
    SET_USERNAME(state, username) {
        state.user.username = username
      },
  }
  