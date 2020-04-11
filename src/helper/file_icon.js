export default function (file_name) {
  const parts = file_name.split(".");
  const extention = parts[parts.length - 1];
  const available_extentions = {
    txt: "txt.svg",
    pdf: "pdf.svg",
    html: "html.svg",
    AEP: "after-effects.svg"
  };
  return available_extentions[extention]
    ? available_extentions[extention]
    : "file.svg";
}
