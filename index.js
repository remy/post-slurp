/* eslint-env node */

const { promisify } = require('util');
const generateId = require('uniqid');
const fs = require('fs');
const tmp = require('os').tmpdir();
const { send, buffer } = require('micro');
const stat = promisify(fs.stat);
const unlink = promisify(fs.unlink);
const appendFile = promisify(fs.appendFile);

module.exports = async (req, res) => {
  if (req.url === '/favicon.ico') {
    return send(res, 204);
  }

  if (req.url === '/') {
    res.setHeader('location', `/${generateId()}`);
    return send(res, 302, 'POST PLS <3');
  }

  const id = req.url
    .slice(1)
    .replace(/\?.*$/, '')
    .split('/')
    .shift()
    .replace(/[^a-z0-9_-]+/gi, '');

  if (!id) {
    return send(res, 400, 'bad request');
  }

  const filename = `${tmp}/${id}`;

  console.log('%s %s', req.method, filename);

  if (req.method === 'DELETE') {
    await unlink(filename);
    return send(res, 200);
  }

  if (req.method === 'POST') {
    const buf = await buffer(req);
    await appendFile(filename, buf);
    await appendFile(filename, '\n');
    return send(res, 201);
  }

  try {
    await stat(filename);
  } catch (e) {
    return send(res, 404, 'not found');
  }

  const stream = fs.createReadStream(filename);
  return stream;
};
