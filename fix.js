const fs = require('fs');
const file = 'src/components/editor/sidebar/templates/templates-sidebar.tsx';
let code = fs.readFileSync(file, 'utf8');
code = code.replace(
  /const pattern = new \(window as any\).fabric.Pattern\(\{\s+source: img,\s+repeat: "no-repeat",\s+\}\);/g,
  `const pattern = new (window as any).fabric.Pattern({
            source: img,
            repeat: "no-repeat",
            crossOrigin: "anonymous"
          });

          (pattern as any).sourceUrl = imageUrl;
          const originalToObject = pattern.toObject.bind(pattern);
          pattern.toObject = function(propertiesToInclude: any) {
            const obj = originalToObject(propertiesToInclude);
            obj.source = this.sourceUrl;
            obj.crossOrigin = "anonymous";
            return obj;
          };`
);
fs.writeFileSync(file, code);
