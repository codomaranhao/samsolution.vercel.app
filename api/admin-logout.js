const { clearCookie } = require('../lib/auth');
module.exports = async function handler(req,res){
  res.setHeader('Content-Type','application/json; charset=utf-8');
  if(req.method!=='POST') return res.status(405).json({ok:false,error:'Método não permitido.'});
  res.setHeader('Set-Cookie', clearCookie());
  return res.status(200).json({ok:true});
};
