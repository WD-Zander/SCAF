import bcrypt from 'bcryptjs';

async function test() {
  const hash = '$2a$10$w3U/d8qUu2o2s/S7i/xR.ey3X6n/U1hB2KzjW3S1B8eY1oJ.0h.oO';
  const isMatch = await bcrypt.compare('123456', hash);
  console.log("Does 123456 match?", isMatch);
}

test();
