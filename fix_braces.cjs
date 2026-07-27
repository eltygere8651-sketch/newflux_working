const fs = require('fs');
const file = 'src/components/FAIView.tsx';
let code = fs.readFileSync(file, 'utf8');

// The problematic blocks look like:
//        } catch(e) {
//          console.error("FAI Genre search failed", e);
//        }
//      }
//    } else if (...)

const target1 = `        } catch(e) {
          console.error("FAI Genre search failed", e);
        }
      }
    } else if`;

const replacement1 = `        } catch(e) {
          console.error("FAI Genre search failed", e);
        }
    } else if`;

code = code.replace(target1, replacement1);

const target2 = `        } catch (e) {
          console.error("FAI Varied Mix search failed", e);
        }
      }
    } else {`;

const replacement2 = `        } catch (e) {
          console.error("FAI Varied Mix search failed", e);
        }
    } else {`;

code = code.replace(target2, replacement2);

const target3 = `          } catch (e) {
            console.error("FAI Algoritmo Discovery search failed", e);
          }
        }
      }

      if (!next) {`;

const replacement3 = `          } catch (e) {
            console.error("FAI Algoritmo Discovery search failed", e);
          }
      }

      if (!next) {`;

code = code.replace(target3, replacement3);

fs.writeFileSync(file, code);
console.log("Fixed braces");
