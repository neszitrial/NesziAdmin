import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  root: "./",

  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        addItem: path.resolve(__dirname, "pages/add-items.html"),
        listItem: path.resolve(__dirname, "pages/list-items.html"),
        orders: path.resolve(__dirname, "pages/orders.html"),
      },
    },
  },

  resolve: {
    alias: {
      "html5-qrcode": "html5-qrcode",
    },
  },
});
