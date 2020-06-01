import validate_ipv4 from "../helper/validate_ipv4";

it("runs correctly", () => {
  
  // correct
  expect(validate_ipv4("127.0.0.1")).toBe(true);
  expect(validate_ipv4("255.255.255.255")).toBe(true);
  expect(validate_ipv4("3.2.1.0")).toBe(true);
  expect(validate_ipv4("192.168.103.254")).toBe(true);
  expect(validate_ipv4("23.200.159.3")).toBe(true);
  expect(validate_ipv4("191.0.1.255")).toBe(true);
  expect(validate_ipv4("192.169.0.0")).toBe(true);

  // wrong
  expect(validate_ipv4("192.168.256.256")).toBe(false);
  expect(validate_ipv4("300.0.4.1")).toBe(false);
  expect(validate_ipv4("192.168..1")).toBe(false);
  expect(validate_ipv4("256.0.0.0")).toBe(false);

});
