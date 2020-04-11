export default function (file_name) {
  const parts = file_name.split(".");
  const extention = parts[parts.length - 1];
  const available_extentions = {
    txt: "txt.svg",
    pdf: "pdf.svg",
    html: "html.svg",
    aep: "after-effects.svg",
    ai: "illustrator.svg",
    au: "audition.svg",
    avi: "avi.svg",
    bct: "bridge.svg",
    css: "css.svg",
    csv: "csv.svg",
    dbf: "dbf.svg",
    doc: "doc.svg",
    dwt: "dreamweaver.svg",
    dwg: "dwg.svg",
    exe: "exe.svg",
    file: "file.svg",
    fw: "fireworks.svg",
    fla: "fla.svg",
    indl: "indesign.svg",
    iso: "iso.svg",
    js: "javascript.svg",
    jpg: "jpg:svg",
    json: "json-file.svg",
    mp3: "mp3.svg",
    mp4: "mp4.svg",
    pdf: "pdf.svg",
    psd: "photoshop.svg",
    png: "png.svg",
    ppt: "ppt.svg",
    plproj: "prelude.svg",
    prtl: "premiere.svg",
    rtf: "rtf.svg",
    search: "search.svg",
    svg: "svg.svg",
    txt: "txt.svg",
    xls: "xls.svg",
    xml: "xml.svg",
    zip: "zip.svg",
    
  };
  return available_extentions[extention]
    ? available_extentions[extention]
    : "file.svg";
}
