interface PlaylistItem {
  videoId: string;
  title: string;
  artist: string;
}

interface YoutubeConfig {
  clientSecret: string;
}

export const youtubeConfig: YoutubeConfig = {
  clientSecret: import.meta.env.VITE_YOUTUBE_API_KEY
};

export async function fetchPlaylistVideos(playlistUrl: string): Promise<PlaylistItem[]> {
  try {
    const apiKey = youtubeConfig.clientSecret;
    // Extract playlist ID from URL
    const playlistId = playlistUrl.match(/[?&]list=([^&]+)/)?.[1];
    if (!playlistId) throw new Error('Invalid playlist URL');

    if (!apiKey) throw new Error(`No token set ${apiKey}`);

    console.log(apiKey);

    let allVideos: PlaylistItem[] = [];
    let nextPageToken: string | undefined = undefined;

    do {
      // Fetch playlist items
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch playlist');
      }

      // Transform the response into our format and append to allVideos
      const videos = data.items.map((item: any) => ({
        videoId: item.snippet.resourceId.videoId,
        // Extract title and artist from video title
        title: extractTitleAndArtist(item.snippet.title).title,
        artist: extractTitleAndArtist(item.snippet.title).artist
      }));

      allVideos = allVideos.concat(videos);

      // Update nextPageToken to fetch the next page (if exists)
      nextPageToken = data.nextPageToken;

    } while (nextPageToken);

    return allVideos;
  } catch (error) {
    console.error('Error fetching playlist:', error);
    throw error;
  }
}

function extractTitleAndArtist(videoTitle: string): { title: string; artist: string } {
  // Step 1: Remove unwanted tags like [Official Video], [Remastered], etc.
  let cleanedTitle = videoTitle.replace(/\[.*?\]/g, '').trim();

  // Step 2: Remove "featuring", "feat.", "ft.", etc.
  const featuringPatterns = /\b(featuring|feat\.?|ft\.?)\b/gi;
  cleanedTitle = cleanedTitle.replace(featuringPatterns, '').trim();

  // Common separators in video titles
  const separators = [' - ', ' – ', ' — ', ' | ', ': ', ' by '];

  for (const separator of separators) {
    if (cleanedTitle.includes(separator)) {
      const [artist, title] = cleanedTitle.split(separator);
      return { 
        title: title?.trim() || cleanedTitle, 
        artist: artist?.trim() || 'Unknown Artist' 
      };
    }
  }

  // If no separator is found, try to extract from "Artist - Topic" format
  if (cleanedTitle.includes(' - Topic')) {
    return {
      artist: cleanedTitle.replace(' - Topic', '').trim(),
      title: cleanedTitle
    };
  }

  // If no clear separation, return the whole title as the title
  return {
    title: cleanedTitle,
    artist: 'Unknown Artist'
  };
}
