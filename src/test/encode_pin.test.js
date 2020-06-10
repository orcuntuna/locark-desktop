import endecode_pin from "../helper/encode_pin";

it("runs correctly", () => {
    /* true dönenler */
    expect(endecode_pin("192.168.2.1")).toBe("BCGZF");
    expect(endecode_pin("192.168.1.33")).toBe("BCFZHH");
    expect(endecode_pin("192.168.1.15")).toBe("BCFZV");
    expect(endecode_pin("127.168.2.55")).toBe("ACGZKK");
    /false dönecekler*/
    // expect(endecode_pin("192.168.2.43")).toBe("BCGZF");
    // expect(endecode_pin("193.168.1.33")).toBe("BCFZHH");
    // expect(endecode_pin("192.158.1.15")).toBe("BCFZV");
    // expect(endecode_pin("127.168.21.55")).toBe("ACGZKK");
});