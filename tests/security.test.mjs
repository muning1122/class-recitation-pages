import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const pages = ["201/index.html", "401/index.html"];

test("201和401页面不再包含匿名或公开写入回退", () => {
  for (const file of pages) {
    const html = readFileSync(file, "utf8");
    for (const forbidden of ["signInAnonymously", "accounts:signUp", "createPublicCloudApi", "createRestCloudApi", 'method: "PUT"']) {
      assert.equal(html.includes(forbidden), false, `${file}仍包含${forbidden}`);
    }
  }
});

test("已有会话和新登录都必须核验教师声明", () => {
  for (const file of pages) {
    const html = readFileSync(file, "utf8");
    for (const required of ["signInWithEmailAndPassword", "getIdTokenResult(user, true)", "token.claims.teacher === true", "signOut(auth)", "return requireTeacherClaim(auth.currentUser)"]) {
      assert.equal(html.includes(required), true, `${file}缺少${required}`);
    }
  }
});

test("两页内联脚本语法有效", () => {
  for (const file of pages) {
    const html = readFileSync(file, "utf8");
    const blocks = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)]
      .filter((match) => !/\bsrc\s*=/.test(match[1]) && !/type\s*=\s*["']module["']/.test(match[1]));
    assert.ok(blocks.length > 0, `${file}没有可检查的内联脚本`);
    blocks.forEach((match, index) => new vm.Script(match[2], { filename: `${file}#script-${index + 1}` }));
  }
});

test("数据库只公开读取背书路径，写入必须是教师", () => {
  const rules = JSON.parse(readFileSync("database.rules.json", "utf8"));
  assert.equal(rules.rules.recitation.$classId[".read"], "$classId === '201' || $classId === '401'");
  assert.equal(rules.rules.recitation.$classId[".write"], "($classId === '201' || $classId === '401') && auth != null && auth.token.teacher === true");
  assert.equal(rules.rules[".read"], false);
  assert.equal(rules.rules[".write"], false);
});
