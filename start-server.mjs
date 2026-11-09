import { createServer } from 'vite';

async function start() {
  try {
    const server = await createServer();
    await server.listen(3030);
    console.log('==========================================================');
    console.log('       PROJECTM - HỆ THỐNG ĐÃ KHỞI ĐỘNG THÀNH CÔNG');
    console.log('==========================================================');
    console.log('  ➜ Địa chỉ máy chủ: http://localhost:3030');
    console.log('  ➜ Nhấn Ctrl + C để dừng máy chủ.');
    console.log('==========================================================\n');
  } catch (err) {
    console.error('[ProjectM Error]', err);
    process.exit(1);
  }
}

start();
