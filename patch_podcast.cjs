const fs = require('fs');
let content = fs.readFileSync('src/components/PodcastView.tsx', 'utf8');

content = content.replace(/src=\{podcast.imageUrl\}/g, 'src={podcast.imageUrl || undefined}');
content = content.replace(/src=\{episode.imageUrl \|\| podcastContext.imageUrl\}/g, 'src={episode.imageUrl || podcastContext.imageUrl || undefined}');
content = content.replace(/src=\{selectedPodcast.imageUrl\}/g, 'src={selectedPodcast.imageUrl || undefined}');
content = content.replace(/src=\{episode.imageUrl \|\| selectedPodcast.imageUrl\}/g, 'src={episode.imageUrl || selectedPodcast.imageUrl || undefined}');
content = content.replace(/src=\{currentEpisode.imageUrl\}/g, 'src={currentEpisode.imageUrl || undefined}');

fs.writeFileSync('src/components/PodcastView.tsx', content);
