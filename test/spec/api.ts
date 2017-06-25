import * as cxml from "@wikipathways/cxml";
import * as gpml from "../xmlns/pathvisio.org/GPML/2013a";
const fs = require("fs");
const path = require("path");

jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000; // 10 second timeout

test("Attach handler w/ _before & _after. Parse stream.", () => {
  expect.assertions(6);

  const parser = new cxml.Parser();
  parser.attach(
    class CustomHandler extends gpml.document.Pathway.constructor {
      _before() {
        expect(this.Name).toBe("one of each - test pathway for development");
      }

      _after() {
        expect(this.Name).toBe("one of each - test pathway for development");
        expect(typeof this.Graphics).toBe("object");
      }
    }
  );

  return parser
    .parse(
      fs.createReadStream(path.resolve(__dirname, "../input/one-of-each.gpml")),
      gpml.document
    )
    .then(doc => {
      //console.log("\n=== 123 ===\n");
      //console.log(JSON.stringify(doc, null, 2));
      expect(typeof doc).toBe("object");
      expect(typeof doc.Pathway).toBe("object");
      expect(doc.Pathway.Name).toBe(
        "one of each - test pathway for development"
      );
    });
});

test("path awareness", () => {
  expect(gpml.document.Pathway.Comment).not.toBe(
    gpml.document.Pathway.DataNode[0].Comment
  );
});
