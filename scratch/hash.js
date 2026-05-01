import bcrypt from "bcryptjs";
async function run() {
  const hash = await bcrypt.hash("Medicalgeria2026!", 12);
  console.log(hash);
}
run();
