"use client";
import { useEffect, useState } from "react";
import { VoteInitialData } from "../types/vote";
import NameSection from "./NameSection";
import { loadIdentity, saveName } from "../lib/getCreateVoterToken";

type Props = {
  shareCode: string;
  initial: VoteInitialData;
};

const TimeVote = ({ shareCode, initial }: Props) => {
  const [voterToken, setVoterToken] = useState<string>(""); //내 token

  const [mode, setMode] = useState(false); // 페이지 관련 상태 f:투표 t:결과
  const [name, setName] = useState(""); // 이름
  const [isMod, setIsMode] = useState(false); //이름 수정
  const [isError, setIsError] = useState(false);

  //내가 이전에 접속했었는지
  useEffect(() => {
    const { voterToken, displayName } = loadIdentity(shareCode);

    setVoterToken(voterToken);
    setName(displayName);
    if (displayName !== "") setIsMode(true);
  }, [shareCode]);

  return (
    <div className="p-4 pb-32 flex flex-col gap-4">
      {/* 이름 입력 카드 */}
      {!mode ? (
        <NameSection
          isMod={isMod}
          name={name}
          onChange={(e) => {
            setIsError(false);
            setName(e.target.value);
          }}
          onBlur={() => {
            setIsMode(true);
            saveName(shareCode, name);
          }}
          changeMode={() => setIsMode(false)}
        />
      ) : (
        <></>
      )}
      <pre>{JSON.stringify(initial, null, 2)}</pre>
    </div>
  );
};

export default TimeVote;
