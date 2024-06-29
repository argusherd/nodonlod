import express from "@/routes";
import { dialog } from "electron";
import supertest from "supertest";

describe("The electron delegation route", () => {
  it("can instruct the electron app to show a open file dialog", async () => {
    const mockedShowDialog = jest
      .spyOn(dialog, "showOpenDialog")
      .mockResolvedValue({
        canceled: false,
        filePaths: ["file.mp3"],
      });

    await supertest(express)
      .get("/electron/file")
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(`id="input-url"`);
        expect(res.text).toContain("file.mp3");
      });

    expect(mockedShowDialog).toHaveBeenCalled();
    expect(mockedShowDialog.mock.lastCall?.at(0)?.properties).toContain(
      "openFile",
    );
  });

  it("can instruct the electron app to show a open directory dialog", async () => {
    const mockedShowDialog = jest
      .spyOn(dialog, "showOpenDialog")
      .mockResolvedValue({
        canceled: false,
        filePaths: ["/my-dir/"],
      });

    await supertest(express)
      .get("/electron/directory")
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(`id="input-url"`);
        expect(res.text).toContain("/my-dir/");
      });

    expect(mockedShowDialog).toHaveBeenCalled();
    expect(mockedShowDialog.mock.lastCall?.at(0)?.properties).toContain(
      "openDirectory",
    );
  });
});
