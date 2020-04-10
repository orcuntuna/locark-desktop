export default function (ip){
  ip = ip.toUpperCase();
  ip = ip.replace(/127./g, "A");
  ip = ip.replace(/192./g, "B");
  ip = ip.replace(/168./g, "C");
  ip = ip.replace(/255/g, "D");
  ip = ip.replace(/10/g, "P");
  ip = ip.replace(/11/g, "R");
  ip = ip.replace(/12/g, "S");
  ip = ip.replace(/13/g, "T");
  ip = ip.replace(/14/g, "U");
  ip = ip.replace(/15/g, "V");
  ip = ip.replace(/16/g, "Y");
  ip = ip.replace(/0/g, "E");
  ip = ip.replace(/1/g, "F");
  ip = ip.replace(/2/g, "G");
  ip = ip.replace(/3/g, "H");
  ip = ip.replace(/4/g, "J");
  ip = ip.replace(/5/g, "K");
  ip = ip.replace(/6/g, "L");
  ip = ip.replace(/7/g, "M");
  ip = ip.replace(/8/g, "N");
  ip = ip.replace(/9/g, "O");
  ip = ip.replace(/\./g, "Z");
  return ip;
}