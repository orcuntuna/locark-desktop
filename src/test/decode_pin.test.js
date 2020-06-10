import decode_pin from "../helper/decode_pin";

it("runs correctly", () => {
    /* true dönenler */
    expect(decode_pin("BCGZF")).toBe("192.168.2.1");
    expect(decode_pin("BCFZHH")).toBe("192.168.1.33");
    expect(decode_pin("BCFZV")).toBe("192.168.1.15");
    expect(decode_pin("ACGZKK")).toBe("127.168.2.55");
    /false dönecekler*/
    // expect(decode_pin("BCGZF")).toBe("192.168.2.43");
    // expect(decode_pin("BCFZHH")).toBe("193.168.1.33");
    // expect(decode_pin("BCFZV")).toBe("192.158.1.15");
    // expect(decode_pin("ACGZKK")).toBe("127.168.21.55");
});