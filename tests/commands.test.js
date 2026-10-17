import test from 'node:test';
import assert from 'node:assert/strict';
import { generateCommands } from '../scripts/commands.js';

test('Generates 21 first-install commands with only the supplied Worker address', () => {
  const text = generateCommands('https://my-chat.example.workers.dev');
  const lines = text.split('\n');
  assert.equal(lines.length, 21);
  assert.equal(new Set(lines.map(line => line.split(' ')[1])).size, 21);
  assert.ok(lines.every(line => line.startsWith('!addcom !')));
  assert.ok(lines.every(line => line.includes('fetch[https://my-chat.example.workers.dev/?')));
  assert.ok(lines.find(line => line.startsWith('!addcom !yemek ')).includes('kullanici=$(sender)&hedef=$(optionalvariable)'));
  assert.ok(!text.includes('optionalrandomuser'));
});

test('Edit mode updates existing commands instead of creating them again', () => {
  assert.ok(generateCommands('https://chat.example.com/', true).split('\n').every(line => line.startsWith('!editcom !')));
});

test('Rejects malformed, insecure and prefilled URLs', () => {
  for (const base of ['not a URL', 'http://example.com', 'https://user:password@example.com', 'https://example.com?token=private', 'https://example.com/#fragment']) {
    assert.throws(() => generateCommands(base));
  }
});
