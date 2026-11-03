// Quản lý thứ tự xếp chồng modal để phím ESC chỉ tác động lên modal trên cùng (Top-most)
let stack: string[] = [];

export const modalStack = {
  push: (id: string) => {
    // Đảm bảo không trùng ID
    stack = stack.filter((item) => item !== id);
    stack.push(id);
  },
  pop: (id: string) => {
    stack = stack.filter((item) => item !== id);
  },
  isTop: (id: string) => {
    return stack.length > 0 && stack[stack.length - 1] === id;
  },
  count: () => stack.length,
};
