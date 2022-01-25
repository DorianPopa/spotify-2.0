import {
	HeartIcon,
	VolumeUpIcon as VolumeDownIcon,
} from "@heroicons/react/outline";
import {
	FastForwardIcon,
	PauseIcon,
	PlayIcon,
	ReplyIcon,
	RewindIcon,
	VolumeUpIcon,
	SwitchHorizontalIcon,
} from "@heroicons/react/solid";
import { debounce } from "lodash";
import { useSession } from "next-auth/react";
import React, { useCallback, useState } from "react";
import { useEffect } from "react/cjs/react.development";
import { useRecoilState } from "recoil";
import { currentTrackIdState, isPlayingState } from "../atoms/songAtom";
import useSongInfo from "../hooks/useSongInfo";
import useSpotify from "../hooks/useSpotify";

const Player = () => {
	const spotifyApi = useSpotify();
	const { data: session, status } = useSession();

	const [currentTrackId, setCurrentTrackId] =
		useRecoilState(currentTrackIdState);
	const [isPlaying, setIsPlaying] = useRecoilState(isPlayingState);

	const [volume, setVolume] = useState(50);
	const songInfo = useSongInfo();

	const fetchCurrentSong = () => {
		if (!songInfo) {
			spotifyApi.getMyCurrentPlayingTrack().then((data) => {
				setCurrentTrackId(data.body?.item?.id);

				spotifyApi.getMyCurrentPlaybackState().then((data) => {
					setIsPlaying(data.body?.is_playing);
				});
			});
		}
	};

	const handlePlayPause = () => {
		spotifyApi.getMyCurrentPlaybackState().then((data) => {
			if (data.body.is_playing) {
				spotifyApi.pause();
				setIsPlaying(false);
			} else {
				spotifyApi.play();
				setIsPlaying(true);
			}
		});
	};

	const onClickVolumeButton = (value) => {
		const newVolume = volume + value;
		if (newVolume > 100) newVolume = 100;
		if (newVolume < 0) newVolume = 0;

		setVolume(newVolume);
	};

	const debouncedAdjustVolume = useCallback(
		debounce((volume) => {
			spotifyApi.setVolume(volume).catch((err) => {});
		}, 250),
		[]
	);

	useEffect(() => {
		if (spotifyApi.getAccessToken() && !currentTrackId) {
			// fetch the songInfo
			fetchCurrentSong();
			setVolume(50);
		}
	}, [currentTrackId, spotifyApi, session]);

	useEffect(() => {
		if (volume < 0 || volume > 100) return;

		debouncedAdjustVolume(volume);
	}, [volume]);

	return (
		<div
			className="h-24 bg-gradient-to-b from-black to-gray-900
     text-white grid grid-cols-3 text-xs md:text-base px-2 md:px-8"
		>
			{/* Left */}
			<div className="flex items-center space-x-4 ">
				<img
					className="hidden md:inline h-10 w-10"
					src={songInfo?.album.images?.[0]?.url}
					alt=""
				/>
				<div>
					<h3>{songInfo?.name}</h3>
					<p>{songInfo?.artists?.[0]?.name}</p>
				</div>
			</div>

			{/* Center */}
			<div className="flex items-center justify-evenly">
				<SwitchHorizontalIcon className="button" />
				<RewindIcon
					className="button"
					onClick={() => spotifyApi.skipToPrevious()}
				/>

				{isPlaying ? (
					<PauseIcon
						className="button w-10 h-10"
						onClick={handlePlayPause}
					/>
				) : (
					<PlayIcon
						className="button w-10 h-10"
						onClick={handlePlayPause}
					/>
				)}

				<FastForwardIcon
					className="button"
					onClick={() => spotifyApi.skipToNext()}
				/>

				<ReplyIcon className="button" />
			</div>

			{/* Right */}
			<div className="flex items-center space-x-3 md:space-x-4 justify-end pr-5">
				<VolumeDownIcon
					className="button"
					onClick={() => onClickVolumeButton(-10)}
				/>
				<input
					className="w-14 md:w-28"
					type="range"
					value={volume}
					onChange={(e) => setVolume(Number(e.target.value))}
					min={0}
					max={100}
				></input>
				<VolumeUpIcon
					className="button"
					onClick={() => onClickVolumeButton(10)}
				/>
			</div>
		</div>
	);
};

export default Player;
