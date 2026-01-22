import { defineConfig } from 'vite'
import myReactPlugin from './vite-plugin-myreact'

export default defineConfig({
  plugins: [myReactPlugin()]
})
