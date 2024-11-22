interface PlaylistItem {
  videoId: string;
  title: string;
  artist: string;
}

export async function fetchPlaylistVideos(playlistUrl: string, apiKey: string): Promise<PlaylistItem[]> {
  try {
    // Extract playlist ID from URL
    const playlistId = playlistUrl.match(/[?&]list=([^&]+)/)?.[1];
    if (!playlistId) throw new Error('Invalid playlist URL');

    // Fetch playlist items
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${apiKey}`
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to fetch playlist');
    }

    console.log(data)

    // Transform the response into our format
    return data.items.map((item: any) => ({
      videoId: item.snippet.resourceId.videoId,
      // Extract title and artist from video title
      title: extractTitleAndArtist(item.snippet.title).title,
      artist: extractTitleAndArtist(item.snippet.title).artist
    }));
  } catch (error) {
    console.error('Error fetching playlist:', error);
    throw error;
  }
}

function extractTitleAndArtist(videoTitle: string): { title: string; artist: string } {
  // Common separators in video titles
  const separators = [' - ', ' – ', ' — ', ' | ', ': ', ' by '];
  
  for (const separator of separators) {
    if (videoTitle.includes(separator)) {
      const [artist, title] = videoTitle.split(separator);
      return { title: title?.trim() || videoTitle, artist: artist?.trim() || 'Unknown Artist' };
    }
  }

  // If no separator is found, try to extract from "Artist - Topic" format
  if (videoTitle.includes(' - Topic')) {
    return {
      artist: videoTitle.replace(' - Topic', '').trim(),
      title: videoTitle
    };
  }

  // If no clear separation, return the whole title as the title
  return {
    title: videoTitle,
    artist: 'Unknown Artist'
  };
}