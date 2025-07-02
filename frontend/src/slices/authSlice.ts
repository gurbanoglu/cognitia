import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  isAuthenticated: boolean;
  user: string | null;
  csrfToken: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  csrfToken: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess(state, action: PayloadAction<{ user: string; csrfToken: string }>) {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.csrfToken = action.payload.csrfToken;
    },
    logout(state) {
      state.isAuthenticated = false;
      state.user = null;
      state.csrfToken = null;
    }
  }
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;