const fs = require('fs');

const path = 'src/components/FAIView.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add selectedGenreRef
content = content.replace(
  '  const lastPrefetchTimeRef = useRef<number>(0);',
  `  const lastPrefetchTimeRef = useRef<number>(0);
  const selectedGenreRef = useRef(selectedGenre);
  useEffect(() => {
    selectedGenreRef.current = selectedGenre;
  }, [selectedGenre]);`
);

// 2. Fix prefetchMoreTracks
content = content.replace(
  `          setGenreBuffer((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const uniqueToAdd = shuffled.filter((s) => !existingIds.has(s.id));
            return [...prev, ...uniqueToAdd];
          });`,
  `          setGenreBuffer((prev) => {
            if (activeGenre !== selectedGenreRef.current) return prev;
            const existingIds = new Set(prev.map((p) => p.id));
            const uniqueToAdd = shuffled.filter((s) => !existingIds.has(s.id));
            return [...prev, ...uniqueToAdd];
          });`
);

// 3. Fix handleNextTrack
content = content.replace(
  `                  const pool = unplayed.length > 0 ? unplayed : foundTracks;
                  const shuffled = pool.sort(() => Math.random() - 0.5);
                  next = shuffled[0];
                  setGenreBuffer(shuffled.slice(1));
                }
              }
            }
          } catch (e) {`,
  `                  const pool = unplayed.length > 0 ? unplayed : foundTracks;
                  const shuffled = pool.sort(() => Math.random() - 0.5);
                  if (activeGenre === selectedGenreRef.current) {
                    next = shuffled[0];
                    setGenreBuffer(shuffled.slice(1));
                  } else {
                    next = null;
                  }
                }
              }
            }
          } catch (e) {`
);

fs.writeFileSync(path, content, 'utf8');
console.log('Done patch_fai_race.cjs');
