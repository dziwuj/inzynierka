import axios from 'axios'
import { API_URL } from '../constants/envs'

export const axiosInstance = axios.create({
  baseURL: API_URL,
})

export const axiosInstanceAuth = axios.create({
  baseURL: API_URL,
  withCredentials: true,
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
axiosInstance.interceptors.response.use(undefined, async (error: any) => {
  console.error(error)
  if (error.response && error.response.status === 401 && import.meta.env.PROD) {
    // redirect to login page
  }

  return Promise.reject(error)
})
