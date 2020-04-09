export default function (pin){
  pin = pin.toUpperCase();
  pin = pin.replace(/A/g, "127.");
  pin = pin.replace(/B/g, "192.");
  pin = pin.replace(/C/g, "168.");
  pin = pin.replace(/D/g, "255");
  pin = pin.replace(/P/g, "10");
  pin = pin.replace(/R/g, "11");
  pin = pin.replace(/S/g, "12");
  pin = pin.replace(/T/g, "13");
  pin = pin.replace(/U/g, "14");
  pin = pin.replace(/V/g, "15");
  pin = pin.replace(/Y/g, "16");
  pin = pin.replace(/E/g, "0");
  pin = pin.replace(/F/g, "1");
  pin = pin.replace(/G/g, "2");
  pin = pin.replace(/H/g, "3");
  pin = pin.replace(/J/g, "4");
  pin = pin.replace(/K/g, "5");
  pin = pin.replace(/L/g, "6");
  pin = pin.replace(/M/g, "7");
  pin = pin.replace(/N/g, "8");
  pin = pin.replace(/O/g, "9");
  pin = pin.replace(/Z/g, ".");
  return pin;
}