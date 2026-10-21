const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const RefreshToken = require('../models/refreshToken');

const REFRESH_TTL_SEC = 60 * 60 * 24 * 1; // 7 days

const hashToken = (t) => crypto.createHash('sha256').update(t).digest('hex');
const createJti = () => crypto.randomBytes(16).toString('hex');

const issueTokens = async (user, req, res) => {
  const jti = createJti();
  const accessToken = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: user._id, jti }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TTL_SEC });

  await RefreshToken.create({
    user: user._id,
    tokenHash: hashToken( refreshToken),
    jti,
    expiresAt: new Date(Date.now() + REFRESH_TTL_SEC * 1000),
    ip: req.ip,
    userAgent: req.headers['user-agent'] || ''
  });

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth/refresh',
    maxAge: REFRESH_TTL_SEC * 1000
  });

  return accessToken;
};

exports.register = async (req, res ) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'All fields required' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const user = await User.create({ name, email, password });
    const accessToken = await issueTokens(user, req, res);

    return res.status(201).json({ accessToken });
  } catch (err) {
    console.log(err.message); }
};

exports.me = async(req,res) =>{
    const { name, email, password } = req.body;
    res.status(201).json( { name, email, password } );
}
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const accessToken = await issueTokens(user, req, res);
    return res.status(200).json({ accessToken });
  } catch (err) { console.log(err.message); }
};

exports.refresh = async (req, res) => {
  try {
    const token = req.cookies['refresh_token'];
    if (!token) return res.status(401).json({ message: 'Session cookie missing' });

    let decoded;
    try { decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET); } 
    catch { return res.status(401).json({ message: 'Invalid token verification signature' }); }

    const tokenHash = hashToken(token);
    const tokenDoc = await RefreshToken.findOne({ tokenHash });

    if (!tokenDoc) return res.status(401).json({ message: 'Token unrecognized' });

    // 🚨 REUSE DETECTION CHAIN (NUCLEAR OPTION)
    if (tokenDoc.revokedAt) {
      await RefreshToken.updateMany({ user: tokenDoc.user }, { $set: { revokedAt: new Date() } });
      res.clearCookie('refresh_token', { path: '/api/auth/refresh' });
      return res.status(403).json({ message: 'Security Breach! Infraction flagged. All sessions evicted.' });
    }

    // Mark current chain element as dead
    const newJti = createJti();
    tokenDoc.revokedAt = new Date();
    tokenDoc.replacedBy = newJti;
    await tokenDoc.save();

    const user = await User.findById(tokenDoc.user);
    const newAccess = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const newRefresh = jwt.sign({ id: user._id, jti: newJti }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TTL_SEC });

    await RefreshToken.create({
      user: user._id,
      tokenHash: hashToken(newRefresh),
      jti: newJti,
      expiresAt: new Date(Date.now() + REFRESH_TTL_SEC * 1000),
      ip: req.ip,
      userAgent: req.headers['user-agent'] || ''
    });

    res.cookie('refresh_token', newRefresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth/refresh',
      maxAge: REFRESH_TTL_SEC * 1000
    });

    return res.status(200).json({ accessToken: newAccess });
  } catch (err) { console.log(err.message); }
};

exports.logout = async (req, res) => {
  try {
    const token = req.cookies['refresh_token'];
    if (token) {
      await RefreshToken.updateOne({ tokenHash: hashToken(token) }, { $set: { revokedAt: new Date() } });
    }
    res.clearCookie('refresh_token', { path: '/api/auth/refresh' });
    return res.status(200).json({ message: 'Logged out.' });
  } catch (err) { console.log(err.message);}
};
