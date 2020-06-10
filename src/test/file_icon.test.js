import file_icon from "../helper/file_icon";

it("runs correctly", () => {

  // Doğru
  expect(file_icon("sedat.jpg")).toBe("jpg.svg");
  expect(file_icon("enis.avi")).toBe("avi.svg");
  expect(file_icon("furkan.file")).toBe("file.svg");
  expect(file_icon("ahmet.mp4")).toBe("mp4.svg");
  expect(file_icon("orcun.pdf")).toBe("pdf.svg");

  // yanlış
  expect(file_icon("enis.mp4")).toBe("pdf.svg");
  expect(file_icon("orcun.avi")).toBe("mp4.svg");
  expect(file_icon("sedat.fireworks")).toBe("dreamweaver.svg");
  expect(file_icon("furkan.exe")).toBe("iso.svg");
  expect(file_icon("ahmet.zip")).toBe("rar.svg");

});